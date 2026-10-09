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



"""[Better approach] Using Prefix and Suffix Array - O(n) Time and O(n) Space"""


def productExceptSelf(arr):
    n = len(arr)
    prefProduct = [1] * n
    suffProduct = [1] * n
    res = [0] * n

    # Construct the prefProduct array
    for i in range(1, n):
        prefProduct[i] = arr[i - 1] * prefProduct[i - 1]

    # Construct the suffProduct array
    for j in range(n - 2, -1, -1):
        suffProduct[j] = arr[j + 1] * suffProduct[j + 1]

    # Construct the result array using
    # prefProduct[] and suffProduct[]
    for i in range(n):
        res[i] = prefProduct[i] * suffProduct[i]

    return res

if __name__ == '__main__':
    arr = [10, 3, 5, 6, 2]
    res = productExceptSelf(arr)
    print(res)