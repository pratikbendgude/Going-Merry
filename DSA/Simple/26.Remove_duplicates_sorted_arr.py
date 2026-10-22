#!/usr/bin/env python3


"""
Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.

Consider the number of unique elements in nums to be k​​​​​​​​​​​​​​. After removing duplicates, return the number of unique elements k.

The first k elements of nums should contain the unique numbers in sorted order. The remaining elements beyond index k - 1 can be ignored.

Custom Judge:

The judge will test your solution with the following code:

int[] nums = [...]; // Input array
int[] expectedNums = [...]; // The expected answer with correct length

int k = removeDuplicates(nums); // Calls your implementation

assert k == expectedNums.length;
for (int i = 0; i < k; i++) {
    assert nums[i] == expectedNums[i];
}

If all assertions pass, then your solution will be accepted.

 

Example 1:

Input: nums = [1,1,2]
Output: 2, nums = [1,2,_]
Explanation: Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.
It does not matter what you leave beyond the returned k (hence they are underscores).

Example 2:

Input: nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]
Explanation: Your function should return k = 5, with the first five elements of nums being 0, 1, 2, 3, and 4 respectively.
It does not matter what you leave beyond the returned k (hence they are underscores).

 

Constraints:

    1 <= nums.length <= 3 * 104
    -100 <= nums[i] <= 100
    nums is sorted in non-decreasing order.


"""


class Solution:
    def removeDuplicates(self, nums: list[int]) -> int:
        i=0
        for j in range(1, len(nums)):
            if nums[j] != nums[i]:
                i+=1
                nums[i]=nums[j]
        return i+1 
            


"""
# LeetCode 26: Remove Duplicates from Sorted Array

### Approach: Two Pointers

**Idea:** Since the array is sorted, duplicates appear next to each other. Use two pointers to keep unique elements at the beginning of the same array.

### Algorithm
1. Initialize `i = 0` to track the index of the last unique element.
2. Start `j` from index `1` and iterate through the array.
3. If `nums[j] != nums[i]`:
   - Increment `i`.
   - Copy `nums[j]` to `nums[i]`.
4. Return `i + 1`, the total number of unique elements.

### Example
**Input:** `nums = [1, 1, 2, 2, 3]`

| j | Comparison | Action | Array |
|---|---|---|---|
| 1 | 1 == 1 | Skip duplicate | `[1, 1, 2, 2, 3]` |
| 2 | 2 != 1 | `i = 1`, set `nums[1] = 2` | `[1, 2, 2, 2, 3]` |
| 3 | 2
"""