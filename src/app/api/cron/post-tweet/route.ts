import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '@/lib/supabase';

// Create a twitter client with keys from env
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

async function handler(req: Request) {
  try {
    const body = await req.json();
    const { content, tweetId } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    console.log("Posting tweet to X API...");
    
    // Check if it's an array (thread) or single string
    if (Array.isArray(content) && content.length > 0) {
      // Post thread
      await twitterClient.v2.tweetThread(content);
    } else {
      // Post single tweet
      await twitterClient.v2.tweet(content);
    }

    console.log("Successfully posted tweet to X!");

    // Update status in Supabase database
    if (tweetId) {
      console.log(`Updating Supabase tweet status for ID: ${tweetId}`);
      const { error: dbError } = await supabase
        .from('tweets')
        .update({ status: 'Posted' })
        .eq('id', tweetId);
      
      if (dbError) {
        console.error('Failed to update tweet status in DB:', dbError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error posting tweet:', error);
    return NextResponse.json({ error: 'Failed to post tweet', details: error.message }, { status: 500 });
  }
}

// Export the handler wrapped with the QStash signature verifier (bypassed in local development)
export const POST = process.env.NODE_ENV === 'development' 
  ? handler 
  : verifySignatureAppRouter(handler);

