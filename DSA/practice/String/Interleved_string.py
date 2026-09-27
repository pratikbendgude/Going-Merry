#!/usr/bin/env python3


"""[Naive Approach] Using Recursion - O(2(m+n)) Time and O(m+n) Auxiliary Space"""



def isInleaveRec(s1, s2, s3, i, j):
    k = i + j

    # If all strings are fully traversed
    if i == len(s1) and j == len(s2) and k == len(s3):
        return True

    a = (i < len(s1)) and (s3[k] == s1[i]) and isInleaveRec(s1, s2, s3, i + 1, j)
    b = (j < len(s2)) and (s3[k] == s2[j]) and isInleaveRec(s1, s2, s3, i, j + 1)

    # If any of the above two possibilities return true
    # otherwise return false.
    return a or b


def isInterleave(s1, s2, s3):
    if len(s1) + len(s2) != len(s3):
        return False
    return isInleaveRec(s1, s2, s3, 0, 0)
    

if __name__ == "__main__":
    s1 = "AAB"
    s2 = "AAC"
    s3 = "AAAABC"
    print("true" if isInterleave(s1, s2, s3) else "false")



"""[Better Approach 1] Using Top-Down(Memoization) DP - O(m*n) Time and O(n*m) Space"""

# Recursive function with memoization 
def isInleaveRec(s1, s2, s3, i, j, dp):
    k = i + j
    m, n = len(s1), len(s2)

    # Base case
    if i == m and j == n and k == len(s3):
        return True

    if dp[i][j] != -1:
        return dp[i][j]

    # If next character of s1 matches with s3
    a = (i < m and s1[i] == s3[k]) and isInleaveRec(s1, s2, s3, i + 1, j, dp)

    # If next character of s2 matches with s3
    b = (j < n and s2[j] == s3[k]) and isInleaveRec(s1, s2, s3, i, j + 1, dp)

    # Store the result before returning
    dp[i][j] = a or b
    return dp[i][j]

def isInterleave(s1, s2, s3):
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False

    dp = [[-1 for _ in range(n + 1)] for _ in range(m + 1)]
    return isInleaveRec(s1, s2, s3, 0, 0, dp)


if __name__ == "__main__":
    s1 = "AAB"
    s2 = "AAC"
    s3 = "AAAABC"
    print("true" if isInterleave(s1, s2, s3) else "false")
