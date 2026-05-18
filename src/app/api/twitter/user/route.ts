import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

// Create a twitter client with keys from env
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY || '',
  appSecret: process.env.TWITTER_API_SECRET || '',
  accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
  accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});

export async function GET() {
  try {
    if (!process.env.TWITTER_API_KEY) {
      return NextResponse.json({ error: 'Twitter API keys not configured' }, { status: 400 });
    }

    // Fetch user details including name, username, and profile image
    const user = await twitterClient.v2.me({
      'user.fields': ['profile_image_url', 'description']
    });

    if (!user || !user.data) {
      return NextResponse.json({ error: 'Failed to retrieve Twitter user info' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.data.name,
      username: user.data.username,
      profileImageUrl: user.data.profile_image_url || null,
    });
  } catch (error: any) {
    console.error('Error fetching Twitter user info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
