#!/usr/bin/env python3

"""Frequency Array - O(n) Time and O(n) Space"""

def findTwoElement(arr):
    n = len(arr)

    # frequency array to count occurrences
    freq = [0] * (n + 1)
    repeating = -1
    missing = -1

    # count frequency of each element
    for num in arr:
        freq[num] += 1

    # identify missing and repeating numbers
    for i in range(1, n + 1):
        if freq[i] == 0:
            missing = i
        elif freq[i] == 2:
            repeating = i

    return [repeating, missing]

if __name__ == "__main__":
    arr = [3, 1, 3]
    ans = findTwoElement(arr)
    print(ans[0], ans[1])



"""Array Marking - O(n) Time and O(1) Space"""



def findTwoElement(arr):
    n = len(arr)
    repeating = -1

    # mark visited indices by negating the value 
    # at that index
    for i in range(n):
        val = abs(arr[i])

        # if value at index val - 1 is already negative,
        # val is repeating
        if arr[val - 1] > 0:
            arr[val - 1] = -arr[val - 1] 
        else:
            # Already visited → repeating element
            repeating = val  

    missing = -1

    # the index with a positive value corresponds 
    # to the missing number
    for i in range(n):
        if arr[i] > 0:
            missing = i + 1
            break

    return [repeating, missing]

if __name__ == "__main__":
    arr = [3, 1, 3]
    ans = findTwoElement(arr)
    print(ans[0], ans[1])






"""Making Two Equations - O(n) Time and O(1) Space"""
def findTwoElement(arr):
    n = len(arr)

    # Expected sum and sum of squares for numbers from 1 to n
    s = (n * (n + 1)) // 2
    ssq = (n * (n + 1) * (2 * n + 1)) // 6

    missing = 0
    repeating = 0

    # Subtract actual sum and sum of squares from expected values
    for num in arr:
        s -= num
        ssq -= num * num

    # Let s = x - y and ssq = x^2 - y^2 = (x - y)(x + y)
    # => x = (s + ssq // s) // 2, y = x - s
    missing = (s + ssq // s) // 2
    repeating = missing - s

    return [repeating, missing]

if __name__ == "__main__":
    arr = [3, 1, 3]
    ans = findTwoElement(arr)
    
    print(ans[0], ans[1])




"""XOR - O(n) Time and O(1) Space
The idea is to use XOR operations to isolate the missing and repeating numbers.

    XOR all array elements with numbers from 1 to n.
    The non-repeating elements cancel out, leaving X ⊕ Y, where X and Y are the missing and repeating numbers.
    Use any set bit in X ⊕ Y to divide the numbers into two groups. A set bit means X and Y have different bits at that position.
    XOR the elements in each group to find the missing and repeating numbers
"""
def findTwoElement(arr):
    n = len(arr)
    xorVal = 0  

    # get the xor of all array elements
    # And numbers from 1 to n
    for i in range(n):
        xorVal ^= arr[i]
        xorVal ^= (i + 1)  # 1 to n numbers

    # get the rightmost set bit in xorVal
    setBitIndex = xorVal & ~(xorVal - 1)
    
    x, y = 0, 0

    # now divide elements into two sets 
    # by comparing rightmost set bit
    for i in range(n):
      
        # decide whether arr[i] is in first set 
        # or second
        if arr[i] & setBitIndex: 
            x ^= arr[i] 
        else: 
            y ^= arr[i]
      
        # decide whether (i+1) is in first set 
        # or second
        if (i + 1) & setBitIndex: 
            x ^= (i + 1) 
        else: 
            y ^= (i + 1)

    # x and y are the repeating and missing values.
    # to know which one is what, traverse the array 
    xCnt = sum(1 for num in arr if num == x)
    
    if xCnt == 0:
        missing, repeating = x, y
    else:
        missing, repeating = y, x

    return [repeating, missing]

if __name__ == "__main__":
    arr = [3, 1, 3]
    ans = findTwoElement(arr)

    print(ans[0], ans[1])