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