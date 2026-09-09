#!/usr/bin/env python3

def removeDuplicates(arr):
    
    # To track seen elements
    seen = set()
    
    # To maintain the new size of the array
    idx = 0

    for i in range(len(arr)):
        if arr[i] not in seen:
            seen.add(arr[i])
            arr[idx] = arr[i]
            idx += 1

    # Return the size of the array 
    # with unique elements
    return idx

if __name__ == "__main__":
    arr = [1, 2, 2, 3, 4, 4, 4, 5, 5]
    newSize = removeDuplicates(arr)

    for i in range(newSize):
        print(arr[i], end=" ")