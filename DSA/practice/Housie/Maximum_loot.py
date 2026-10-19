#!/usr/bin/env python3




"""Question 7: Krish's Maximum Loot
Problem
You are given n positive integers representing the values of notes arranged in a line.

You cannot choose two adjacent notes.

Find the maximum total value you can collect.

Sample input
5
2 7 9 3 1

Output
12

The optimal selection is:
\[
2+9+1=12
\]
The selected elements are at indices 0, 2, and 4, so none are adjacent.
Best approach: Dynamic programming
This is the classic House Robber problem.

For every position i, we decide whether to take its value or skip it.

There are two possibilities.

Option 1: Skip the current note

The best result remains:
\[
dp[i-1]
\]
Option 2: Take the current note

Then we cannot take the immediately preceding note:
\[
a_i+dp[i-2]
\]
Therefore:
\[
dp[i]=\max(dp[i-1],a_i+dp[i-2])
\]
We only need the previous two results, so we can optimize the space usage.


Why initialize both variables to zero?
The notes have positive values, and choosing no notes is represented by zero while building the dynamic programming states.

The first note produces max(0, 2) = 2, and the algorithm then builds the optimal result.
Complexity
- Time: O(n)
- Auxiliary space: O(1), excluding the input array.
Remember: When the problem says you cannot choose adjacent elements and asks for the maximum total, consider dynamic programming



"""



n = int(input())
a = list(map(int, input().split()))

prev2 = 0
prev1 = 0

for value in a:
    current = max(prev1, prev2 + value)
    prev2 = prev1
    prev1 = current

print(prev1)