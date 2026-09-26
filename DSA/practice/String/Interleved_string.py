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
