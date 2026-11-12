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







"""[Approach 2] - Rearranging array by swapping elements"""

def rearrangeArray(arr):
    n = len(arr)

    # Traverse the array and make adjustments to satisfy the condition
    for i in range(1, n):

        # Check if the index is even (1-based), i.e., i+1 is even
        if (i + 1) % 2 == 0:
            # Ensure that the current element is greater than
            # or equal to the previous element
            if arr[i] < arr[i - 1]:
                arr[i], arr[i - 1] = arr[i - 1], arr[i]
        else:
            # Ensure that the current element is less than or
            # equal to the previous element
            if arr[i] > arr[i - 1]:
                arr[i], arr[i - 1] = arr[i - 1], arr[i]

    return arr


if __name__ == "__main__":

    inputArray = [1, 2, 2, 1]

    resultArray = rearrangeArray(inputArray)

    print(" ".join(map(str, resultArray)))