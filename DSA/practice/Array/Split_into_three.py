#!/usr/bin/env python3

"""[Naive Approach] By finding all possible partitions - O(n^3) Time and O(1) Space"""

def findSum(arr, start, end):
    sum_ = 0
    for i in range(start, end + 1):
        sum_ += arr[i]
    return sum_

# function to return the index pair of equal sum segments  
def findSplit(arr):
    n = len(arr)
  
    # First partition
    for i in range(n - 2):
        
        # Second Partition
        for j in range(i + 1, n - 1):
            
            # Find sum of all three segments
            sum1 = findSum(arr, 0, i)
            sum2 = findSum(arr, i + 1, j)
            sum3 = findSum(arr, j + 1, n - 1)
            
            # If all three segments have equal sum,
            # then return true
            if sum1 == sum2 and sum2 == sum3:
                return [i, j]
  
    # No possible index pair found
    return [-1, -1]

if __name__ == "__main__":
    arr = [1, 3, 4, 0, 4]
    res = findSplit(arr)
    
    print(res[0], res[1])




"""[Expected Approach] Finding first two segments- O(n) Time and O(1) Space"""
# Python program to find if the array can be divided into
# three segments by finding first two segments

# function to return the index pair of equal sum segments
def findSplit(arr):
    res = []
    total = 0

    for ele in arr:
        total += ele

    # If the total sum is not divisible by 3,
    # it's impossible to split the array
    if total % 3 != 0:
        res = [-1, -1]
        return res

    # Keep track of the sum of current segment
    currSum = 0

    for i in range(len(arr)):
        currSum += arr[i]

        # If the valid segment is found, store its index
        # and reset current sum to zero
        if currSum == total / 3:
            currSum = 0
            res.append(i)

            # If two valid segments are found and third non
            # empty segment is possible, return the index pair
            if len(res) == 2 and i < len(arr) - 1:
                return res

    # If no index pair is possible
    res = [-1, -1]
    return res

if __name__ == "__main__":
    arr = [1, 3, 4, 0, 4]
    res = findSplit(arr)

    print(res[0], res[1])