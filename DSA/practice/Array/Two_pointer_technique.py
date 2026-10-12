#!/usr/bin/env python3



"""Naive Method - O(n^2) Time and O(1) Space"""
"""mostly used when the array is unsorted"""
# Function to check whether any pair exists
# whose sum is equal to the given target value
def two_sum(arr, target):
    n = len(arr)

    # Iterate through each element in the array
    for i in range(n):
      
        # For each element arr[i], check every
        # other element arr[j] that comes after it
        for j in range(i + 1, n):
          
            # Check if the sum of the current pair
            # equals the target
            if arr[i] + arr[j] == target:
                return True
              
    # If no pair is found after checking
    # all possibilities
    return False

arr = [0, -1, 2, -3, 1]
target = -2

# Call the two_sum function and print the result
if two_sum(arr, target):
    print("true")
else:
    print("false")





"""Two-Pointer Technique - O(n) time and O(1) space"""
"""when the array is sorted we use this technique where we start from both ends"""
# Function to check whether any pair exists
# whose sum is equal to the given target value
def two_sum(arr, target):
    # Sort the array

    left, right = 0, len(arr) - 1

    # Iterate while left pointer is less than right
    while left < right:
        sum = arr[left] + arr[right]

        # Check if the sum matches the target
        if sum == target:
            return True
        elif sum < target: 
            left += 1  # Move left pointer to the right
        else:
            right -= 1 # Move right pointer to the left

    # If no pair is found
    return False

arr = [-3, -1, 0, 1, 2]
target = -2

# Call the two_sum function and print the result
if two_sum(arr, target):
    print("true")
else:
    print("false")