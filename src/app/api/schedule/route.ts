import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client as QStashClient } from '@upstash/qstash';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize QStash Client
const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN || '' });

// Helper to get site URL dynamically
const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

// POST: Create a new tweet (either Draft or Scheduled)
export async function POST(req: Request) {
  try {
    const { content, status, scheduledFor } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 1. Save to Supabase first as a Draft/Pending record to get a Tweet ID
    const { data: tweet, error: dbError } = await supabase
      .from('tweets')
      .insert([
        {
          content: typeof content === 'string' ? content : JSON.stringify(content),
          status: status || 'Draft',
          scheduled_for: scheduledFor || null,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: `Database error: ${dbError.message} (Code: ${dbError.code})` }, { status: 500 });
    }

    // 2. If it is scheduled, queue it in QStash
    if (status === 'Scheduled' && scheduledFor) {
      try {
        console.log(`Scheduling background task with QStash for: ${scheduledFor}`);
        
        const qstashResponse = await qstash.publishJSON({
          url: `${getSiteUrl()}/api/cron/post-tweet`,
          body: {
            content: content,
            tweetId: tweet.id,
          },
          // Convert scheduled time to unix timestamp in seconds
          notBefore: Math.floor(new Date(scheduledFor).getTime() / 1000),
        });

        // 3. Update Supabase with the QStash message ID
        const { error: updateError } = await supabase
          .from('tweets')
          .update({ qstash_message_id: qstashResponse.messageId })
          .eq('id', tweet.id);

        if (updateError) {
          console.error('Failed to update qstash message id in DB:', updateError);
        }
      } catch (qstashError: any) {
        console.error('QStash scheduling failed:', qstashError);
        // Rollback status to Draft since scheduling failed
        await supabase.from('tweets').update({ status: 'Draft', scheduled_for: null }).eq('id', tweet.id);
        return NextResponse.json({ 
          error: `Failed to schedule with QStash: ${qstashError.message || 'Unknown QStash Error'}. Saved as Draft instead.`
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, tweet });
  } catch (error: any) {
    console.error('Schedule POST handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cancel a scheduled tweet and delete from Supabase
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    // 1. Fetch the tweet first to check if it has an active QStash message ID
    const { data: tweet, error: fetchError } = await supabase
      .from('tweets')
      .select('qstash_message_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    // 2. If it is scheduled, cancel it in QStash
    if (tweet.status === 'Scheduled' && tweet.qstash_message_id) {
      try {
        console.log(`Cancelling QStash message: ${tweet.qstash_message_id}`);
        await qstash.messages.delete(tweet.qstash_message_id);
      } catch (qstashError) {
        console.warn('Could not cancel QStash task (it might have already run):', qstashError);
      }
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await supabase
      .from('tweets')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete tweet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Schedule DELETE handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing tweet (reschedule or change content)
export async function PUT(req: Request) {
  try {
    const { id, content, status, scheduledFor } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Tweet ID is required' }, { status: 400 });
    }

    // 1. Fetch current tweet state
    const { data: existingTweet, error: fetchError } = await supabase
      .from('tweets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    // 2. If it was scheduled previously, cancel the old QStash task
    if (existingTweet.status === 'Scheduled' && existingTweet.qstash_message_id) {
      try {
        console.log(`Cancelling old QStash message: ${existingTweet.qstash_message_id}`);
        await qstash.messages.delete(existingTweet.qstash_message_id);
      } catch (qstashError) {
        console.warn('Could not cancel old QStash task:', qstashError);
      }
    }

    let newQstashMessageId = null;

    // 3. If new status is Scheduled, queue it in QStash
    if (status === 'Scheduled' && scheduledFor) {
      try {
        console.log(`Scheduling new background task with QStash for: ${scheduledFor}`);
        const qstashResponse = await qstash.publishJSON({
          url: `${getSiteUrl()}/api/cron/post-tweet`,
          body: {
            content: content || existingTweet.content,
            tweetId: id,
          },
          notBefore: Math.floor(new Date(scheduledFor).getTime() / 1000),
        });
        newQstashMessageId = qstashResponse.messageId;
      } catch (qstashError: any) {
        console.error('QStash scheduling failed on update:', qstashError);
        return NextResponse.json({ 
          error: `Failed to reschedule background task: ${qstashError.message}. Changes rolled back.`
        }, { status: 500 });
      }
    }

    // 4. Update the DB record
    const { data: updatedTweet, error: updateError } = await supabase
      .from('tweets')
      .update({
        content: content ? (typeof content === 'string' ? content : JSON.stringify(content)) : existingTweet.content,
        status: status || existingTweet.status,
        scheduled_for: status === 'Scheduled' ? scheduledFor : (status === 'Draft' ? null : existingTweet.scheduled_for),
        qstash_message_id: newQstashMessageId,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update tweet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tweet: updatedTweet });
  } catch (error: any) {
    console.error('Schedule PUT handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
