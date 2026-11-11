#!/usr/bin/env python3


"""[Approach 1] - Assign Maximum Elements to Even Positions"""

def rearrangeArray(arr):
    arr.sort()

    n = len(arr)
    result = [0] * n
    ptr1, ptr2 = 0, n - 1

    for i in range(n):
      
        # Assign even indexes (1-based) with maximum elements
        if (i + 1) % 2 == 0:
            result[i] = arr[ptr2]
            ptr2 -= 1
            
        # Assign odd indexes (1-based) with remaining elements
        else:
            result[i] = arr[ptr1]
            ptr1 += 1

    return result

 
arr = [1, 2, 2, 1]
res = rearrangeArray(arr)
print(res)