# backtube1/prompts.py

CLUSTER_NAMING_PROMPT = """You are a YouTube content analyst. 
Given these video titles that belong to the same topic group, give this group a short descriptive name (2-4 words max).

Video titles:
{titles}

Respond with ONLY the topic name, nothing else."""