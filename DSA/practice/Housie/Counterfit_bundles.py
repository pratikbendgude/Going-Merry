#!/usr/bin/env python3




"""Problem
You are given:
- n: Number of printing machines.
- x: Checkpoint position.
- a[i]: Position of each printing machine.
Find the largest positive integer d such that the distance between the checkpoint and every printing machine is divisible by d.
In mathematical terms:
\[
d \mid |a_i-x|
\]
for every machine.
Sample input
3 10
13 16 22

Output
3

Best approach: Greatest Common Divisor (GCD)
First, calculate the absolute distances from the checkpoint.
For the sample:
\[
|13-10|=3
\]
\[
|16-10|=6
\]
\[
|22-10|=12
\]
We need the largest positive integer dividing all three distances.
Therefore:
\[
d=\gcd(3,6,12)=3
\]
For multiple numbers, the largest common divisor is obtained by repeatedly applying GCD:
\[
d=\gcd(|a_1-x|,|a_2-x|,\ldots,|a_n-x|)
\]
Python provides GCD through the math module
Why initialize d = 0?
The GCD identity is:
\[
\gcd(0,k)=k
\]
So the first iteration automatically initializes d to the first distance.
Complexity
- Time: O(n log M) approximately, where \(M\) is the largest distance.
- Auxiliary space: O(n), for the input array.
Remember: This is a GCD problem, not a problem where you test every possible divisor."""




from math import gcd

n, x = map(int, input().split())
a = list(map(int, input().split()))

d = 0

for position in a:
    d = gcd(d, abs(position - x))

print(d)