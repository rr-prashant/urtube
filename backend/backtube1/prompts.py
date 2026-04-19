# prompt for give a name to cluster group
CLUSTER_NAMING_PROMPT = """You are a YouTube content analyst. 
Given these video titles that belong to the same topic group, give this group a short descriptive name (2-4 words max).

Video titles:
{titles}

Respond with ONLY the topic name, nothing else."""

# Video insights prompt template for analyzing a single video's performance and providing actionable feedback. The prompt includes placeholders for video data and instructs the model to respond in a specific JSON format with insights on what worked, what could be improved, and a new video idea based on the analysis.
VIDEO_INSIGHTS_PROMPT = """You are a YouTube growth strategist analyzing a single video's performance.

Video Title: {title}
Description: {description}
Views: {views}
Likes: {likes}
Comments: {comments_count}
Sentiment Score: {sentiment_score} (scale: -1 to +1)
Sentiment Breakdown: {positive_percent}% positive, {neutral_percent}% neutral, {negative_percent}% negative
User's Average Views: {avg_views}

Respond in this exact JSON format and nothing else:
{{
    "what_worked": "One paragraph on why this video performed well or poorly based on the data",
    "improve": "One paragraph on what could be improved for future similar content",
    "next_idea": "One specific video idea that builds on this video's topic and fixes the weaknesses"
}}"""

# prompt to recommend new ideas based on the analysis of the creator's channel data, including best and worst performing topics, overall channel stats, and sentiment analysis. The prompt instructs the model to provide 5 new video title suggestions along with reasons for why each would perform well based on the channel data, all formatted in a specific JSON structure.
RECOMMENDATIONS_PROMPT = """You are a YouTube growth strategist. Analyze this creator's channel data and suggest new content ideas.

Creator's Video Titles (grouped by topic):
{cluster_data}

Best Performing Topic: {best_cluster_name} (avg {best_cluster_views} views, {best_cluster_engagement}% engagement)
Worst Performing Topic: {worst_cluster_name} (avg {worst_cluster_views} views, {worst_cluster_engagement}% engagement)

Overall Channel Stats:
Total Videos: {total_videos}
Average Sentiment: {avg_sentiment}

Respond in this exact JSON format and nothing else:
{{
    "channel_analysis": "2-3 sentences analyzing the channel's strengths, weaknesses, and overall content strategy",
    "top_tip": "One specific actionable tip to improve the channel's performance",
    "recommendations": [
        {{
            "title": "Suggested video title",
            "reason": "Why this video would perform well based on the channel data"
        }},
        {{
            "title": "Suggested video title",
            "reason": "Why this video would perform well based on the channel data"
        }},
        {{
            "title": "Suggested video title",
            "reason": "Why this video would perform well based on the channel data"
        }},
        {{
            "title": "Suggested video title",
            "reason": "Why this video would perform well based on the channel data"
        }},
        {{
            "title": "Suggested video title",
            "reason": "Why this video would perform well based on the channel data"
        }}
    ]
}}"""