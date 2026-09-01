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