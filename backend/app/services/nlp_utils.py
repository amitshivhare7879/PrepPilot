import re

def analyze_speech_metrics(transcript: str, duration_seconds: float = 60.0):
    """
    Data Science logic to track verbal tics and speaking pace.
    """
    # 1. Filler Word Detection
    fillers = ["um", "uh", "like", "basically", "actually", "you know"]
    filler_counts = {}
    total_fillers = 0

    for word in fillers:
        # Use regex to find whole words only (case insensitive)
        count = len(re.findall(r'\b' + word + r'\b', transcript.lower()))
        if count > 0:
            filler_counts[word] = count
            total_fillers += count

    # 2. Speaking Pace (Words Per Minute)
    word_count = len(transcript.split())
    # Avoid division by zero
    mins = max(duration_seconds / 60.0, 0.1)
    wpm = round(word_count / mins)

    # 3. Insight Generation
    pace_feedback = "Good"
    if wpm < 110: pace_feedback = "Too Slow"
    elif wpm > 160: pace_feedback = "Too Fast"

    return {
        "total_fillers": total_fillers,
        "filler_details": filler_counts,
        "wpm": wpm,
        "pace_status": pace_feedback
    }