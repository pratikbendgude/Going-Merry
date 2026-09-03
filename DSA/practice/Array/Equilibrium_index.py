#!/usr/bin/env python3
"""[Naive Approach] Using Nested Loop - O(n2) Time and O(1) Space"""

def findEquilibrium(arr):
    
    # Check for indexes one by one until
    # an equilibrium index is found 
    for i in range(len(arr)):
        # Get left sum
        leftSum = sum(arr[:i])

        # Get right sum
        rightSum = sum(arr[i + 1:])

        # Check the condition
        if leftSum == rightSum:
            return i
            
    return -1
  
if __name__ == '__main__':
    arr = [-7, 1, 5, 2, -4, 3, 0]

    print(findEquilibrium(arr))

"""[Better Approach] Prefix Sum and Suffix Sum Array - O(n) Time and O(n) Space"""

def findEquilibrium(arr):
    n = len(arr)

    pref = [0] * n
    suff = [0] * n

    # Initialize the ends of prefix
    # and suffix array
    pref[0] = arr[0]
    suff[n - 1] = arr[n - 1]

    # Calculate prefix sum for all indices
    for i in range(1, n):
        pref[i] = pref[i - 1] + arr[i]

    # Calculating suffix sum for all indices
    for i in range(n - 2, -1, -1):
        suff[i] = suff[i + 1] + arr[i]

    # Checking if prefix sum 
    # is equal to suffix sum
    for i in range(n):
        if pref[i] == suff[i]:
            return i

    return -1
  
if __name__ == "__main__":
    arr = [-7, 1, 5, 2, -4, 3, 0]

    print(findEquilibrium(arr))


"""[Expected Approach] Running Prefix Sum and Suffix Sum - O(n) Time and O(1) Space"""


def equilibriumPoint(arr):
    prefSum = 0
    total = sum(arr)

    # Iterate pivot over all the elements
    # of the array and till prefSum != suffSum
    for pivot in range(len(arr)):
        suffSum = total - prefSum - arr[pivot]
        if prefSum == suffSum:
            return pivot
        prefSum += arr[pivot]

    return -1

if __name__ == "__main__":
    arr = [1, 7, 3, 6, 5, 6]

    result = equilibriumPoint(arr)
    print(result)