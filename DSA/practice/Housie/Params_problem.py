#!/usr/bin/env python3


"""
Problem
You are given n meetings, each with a start time and an end time.
Only one meeting can use the venue at a time.
However, a meeting can begin exactly when another meeting ends.
Find the maximum number of meetings that can be conducted.
Sample input

5
1 4
3 5
0 6
5 7
8 9

Output
3

Best approach: Greedy algorithm
The key idea is:
Always choose the meeting that finishes earliest among the meetings that can still be selected.
Why?
A meeting that finishes earlier leaves more time available for subsequent meetings.
This is the classic interval scheduling problem.
Algorithm
1. Store every meeting as (start, end).
2. Sort meetings by their ending times.
3. Select the first meeting.
4. For every subsequent meeting:
   - If its start time is greater than or equal to the end time of the last selected meeting, select it.
5. Print the total number selected.

Complexity
- Time: O(n log n), because of sorting.
- Auxiliary space: O(n), for the meetings list.
Important: The condition is s >= last_end, not s > last_end, because meetings are allowed to start exactly when another ends.
Python tip: The default tuple sort would sort by start time first. Explicitly sorting with key=lambda meeting: meeting[1] ensures that the meetings are ordered by ending time
"""

n = int(input())

meetings = []

for _ in range(n):
    s, e = map(int, input().split())
    meetings.append((s, e))

meetings.sort(key=lambda meeting: meeting[1])

count = 0
last_end = 0

for s, e in meetings:
    if s >= last_end:
        count += 1
        last_end = e

print(count)