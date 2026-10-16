#!/usr/bin/env python3


"""Question 2: Manan's Wi-Fi Load Monitor
Problem
You are given the connection and disconnection times of n devices.
A device occupies the network from its connection time until its disconnection time.
Find the maximum number of devices connected simultaneously.
A crucial condition in the question is:
If one device disconnects at time t and another connects at time t, they are not considered simultaneous.
Sample input
5
1 4
2 5
7 9
3 6
5 8

Best approach: Sweep line algorithm
Imagine moving a point along the timeline.
- When a device connects, the active device count increases by 1.
- When a device disconnects, the active device count decreases by 1.
- Track the maximum active count.
The important part is handling events at the same time correctly.
For this problem, process disconnection events before connection events at the same timestamp.
There are two ways to implement this:
1. Create events and sort them.
2. Sort the connection and disconnection times separately.
The second method is particularly simple and efficient.

Why does this work?
Consider these intervals:
Device A: 1 -------- 4
Device B:       2 -------- 5

At time 2, two devices are connected.
At time 4, Device A disconnects. If another device connects exactly at time 4, the active count must decrease before increasing.
Therefore, we use:
if starts[i] < ends[j]:


Notice the strict <, not <=.
When the times are equal, the else branch executes first, processing the disconnection.
Complexity
- Time: O(n log n), because both lists are sorted.
- Auxiliary space: O(n), for the two lists.
Alternative: You can create events as (time, type) pairs and sort them with disconnections ordered before connections. That is also correct, but the two-list method is easy to remember."""





n = int(input())

starts = []
ends = []

for _ in range(n):
    s, e = map(int, input().split())
    starts.append(s)
    ends.append(e)

starts.sort()
ends.sort()

i = 0
j = 0

active = 0
maximum = 0

while i < n:
    if starts[i] < ends[j]:
        active += 1
        maximum = max(maximum, active)
        i += 1
    else:
        active -= 1
        j += 1

print(maximum)