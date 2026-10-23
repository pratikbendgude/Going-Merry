#!/usr/bin/env python3






"""
Problem
You are given:
- n: Number of lecture videos.
- T: Total available time.
- a[i]: Duration of each video.
The videos must be watched in their original order.

Find the maximum number of consecutive videos that can be watched within T minutes.

All durations are positive.

Sample input
8 10
2 3 1 2 4 1 1 2

Output
5

The first five videos take:
\[
2+3+1+2+4=12
\]
That exceeds 10, so the five-video sequence beginning at the first video is not valid. The actual optimal sequence is the five videos:
\[
1+2+4+1+1=9
\]
Thus, the answer is 5.
Best approach: Sliding window
Because all video durations are positive, we can use a sliding window instead of checking every possible consecutive sequence.

Maintain:
- left: Start of the current window.
- right: End of the current window.
- total: Sum of durations in the window.
- maximum: Largest valid window length.
For each new video:
1. Add its duration to total.
2. If the total exceeds T, remove videos from the beginning until the sum is valid again.
3. Update the maximum window length.




Why is sliding window better than brute force?
A brute-force solution would check every consecutive sequence, potentially requiring O(n²) time.

With sliding window:
- right moves forward at most n times.
- left also moves forward at most n times.
Therefore, the total work is linear.
Complexity
- Time: O(n)
- Auxiliary space: O(1), excluding the input array.
Important: Sliding window works here because every duration is positive. With arbitrary negative values, this technique would not generally solve the problem correctly.
"""



n, T = map(int, input().split())
a = list(map(int, input().split()))

left = 0
total = 0
maximum = 0

for right in range(n):
    total += a[right]

    while total > T:
        total -= a[left]
        left += 1

    maximum = max(maximum, right - left + 1)

print(maximum)