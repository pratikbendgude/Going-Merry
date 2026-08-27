#!/usr/bin/env python3


# Function to right rotate array by d positions
def rotateArr(arr, d):
    n = len(arr)
  
    # Repeat the rotation d times
    for _ in range(d):
      
        # Right rotate the array by one position
        last = arr[n - 1]
        for i in range(n - 1, 0, -1):
            arr[i] = arr[i - 1]
        arr[0] = last

if __name__ == "__main__":
    arr = [1, 2, 3, 4, 5, 6]
    d = 2

    rotateArr(arr, d)

    # Print the rotated array
    for i in range(len(arr)):
        print(arr[i], end=" ")



# Python Program to right rotate the array by d positions
# using temporary array

def rotateArr(arr, d):
    n = len(arr)

    # Handle case when d > n
    d %= n

    # Storing rotated version of array
    temp = [0] * n

    # Copy last d elements to the front of temp
    for i in range(d):
        temp[i] = arr[n - d + i]

    # Copy the first n - d elements to the back of temp
    for i in range(n - d):
        temp[i + d] = arr[i]

    # Copying the elements of temp in arr
    # to get the final rotated array
    for i in range(n):
        arr[i] = temp[i]

if __name__ == "__main__":
    arr = [1, 2, 3, 4, 5, 6]
    d = 2

    rotateArr(arr, d)

    # Print the rotated array
    print(' '.join(map(str, arr)))