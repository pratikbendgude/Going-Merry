#!/usr/bin/env python3
"""nested approach"""
def findUnique(arr):
    n = len(arr)

    # Iterate over every element
    for i in range(n):

        # Initialize count to 0
        count = 0

        for j in range(n):

            # Count the frequency of the element
            if arr[i] == arr[j]:
                count += 1

        # If the frequency of the element is one
        if count == 1:
            return arr[i]

    # If no element exists at most once
    return -1

if __name__ == "__main__":
    arr = [2, 3, 5, 4, 5, 3, 4]
    print(findUnique(arr))


"""hash Mapping approach"""
def findUnique(arr):
    # Dictionary to store the count of each element
    cnt = {}

    # Store frequency of each element
    for num in arr:
        cnt[num] = cnt.get(num, 0) + 1

    # Return the value with count = 1
    for key, value in cnt.items():
        if value == 1:
            return key

    # If no element exists that appears only once
    return -1

arr = [2, 3, 5, 4, 5, 3, 4]
print(findUnique(arr))