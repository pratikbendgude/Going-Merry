#!/usr/bin/env python3



"""[Naive Approach] - O(n) Time and O(n) Space"""



# A function to find a sorted sub-sequence of size 3
def find3Numbers(arr):
    n = len(arr)

    # Fill smaller[] such that smaller[i] stores the
    # index of a smaller element on the left side
    smaller = [-1] * n
    min = 0
    for i in range(1, n):
        if arr[i] <= arr[min]:
            min = i
        else:
            smaller[i] = min

    # Fill greater[] such that greater[i] stores the
    # index of a greater element on the right side
    greater = [-1] * n
    max = n - 1
    for i in range(n - 2, -1, -1):
        if arr[i] >= arr[max]:
            max = i
        else:
            greater[i] = max

    # Find the triplet
    for i in range(n):
        if smaller[i] != -1 and greater[i] != -1:
            return [arr[smaller[i]], arr[i], arr[greater[i]]]

    # If no such triplet is found, return an empty vector
    return []


# Driver code
arr = [12, 11, 10, 5, 6, 2, 30]
res = find3Numbers(arr)
for x in res:
    print(x, end=' ')