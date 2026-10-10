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




"""[Efficient Approach] Using Product Array - O(n) Time and O(1) Space"""


def productExceptSelf(arr):
    zeros = 0
    idx = -1
    prod = 1

    # Count zeros and track the index of the zero
    for i in range(len(arr)):
        if arr[i] == 0:
            zeros += 1
            idx = i
        else:
            prod *= arr[i]

    res = [0] * len(arr)

    # If no zeros, calculate the product for all elements
    if zeros == 0:
        for i in range(len(arr)):
            res[i] = prod // arr[i]
    # If one zero, set product only at the zero's index
    elif zeros == 1:
        res[idx] = prod

    return res


if __name__ == "__main__":
    arr = [10, 3, 5, 6, 2]
    res = productExceptSelf(arr)
    print(" ".join(map(str, res)))