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