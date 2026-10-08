#!/usr/bin/env python3


"""[Naive Approach] Using Nested Loops - O(n^2) Time and O(n) Space"""

def productExceptSelf(arr):
    n = len(arr)

    # Initialize the result list as 1
    res = [1] * n

    for i in range(n):
        
        # Compute the product of all except arr[i]
        for j in range(n):
            if i != j:
                res[i] *= arr[j]

    return res

if __name__ == "__main__":
    arr = [10, 3, 5, 6, 2]
    res = productExceptSelf(arr)
    print(" ".join(map(str, res)))