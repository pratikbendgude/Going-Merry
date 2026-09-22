#!/usr/bin/env python3

"""[Expected Approach 1] Using Iterative Comparison - O(n) time and O(1) space"""

# this function returns value of a Roman symbol
def value(r):
    if r == 'I':
        return 1
    if r == 'V':
        return 5
    if r == 'X':
        return 10
    if r == 'L':
        return 50
    if r == 'C':
        return 100
    if r == 'D':
        return 500
    if r == 'M':
        return 1000
    return -1

# returns decimal value of roman numeral
def romanToInteger(s):
	res = 0
	i = 0
	while i < len(s):
        
		# get value of current symbol
		s1 = value(s[i])

		# compare with the next symbol if it exists
		if i + 1 < len(s):
			s2 = value(s[i + 1])

			# if current value is greater or equal, 
			# add it to result
			if s1 >= s2:
				res += s1
			else:
				# else, add the difference and 
				# skip next symbol
				res += (s2 - s1)
				i += 1
		else:
			res += s1
		i += 1

	return res

if __name__ == "__main__":
    s = "IX"
    print(romanToInteger(s))