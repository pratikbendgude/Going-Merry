#!/usr/bin/env python3



"""[Naive Approach] By Trying All Possibility - O(2^n) Time and O(n) Space
The idea is to use recursion to simulate all choices of buying and selling. 
For each day, you can either skip it or buy on that day. If you buy at day i,
then you try all possible selling days j > i where price[j] > price[i].
"""
def maxProfitRec(price, start, end):
    res = 0

    # Try every possible pair of buy (i) and sell (j)
    for i in range(start, end):
        for j in range(i + 1, end + 1):
         
            # Valid transaction if selling price > buying price
            if price[j] > price[i]:
                curr = (price[j] - price[i]) + \
                       maxProfitRec(price, start, i - 1) + \
                       maxProfitRec(price, j + 1, end)
                res = max(res, curr)
    return res

def maxProfit(prices):
    return maxProfitRec(prices, 0, len(prices) - 1)

if __name__ == "__main__":
    prices = [100, 180, 260, 310, 40, 535, 695]
    print(maxProfit(prices))





"""[Better Approach] Using Local Minima and Maxima - O(n) Time and O(1) Space
The idea is to traverse the array from left to right and 
Find local minima (where price starts rising) and then a local maxima (where price stops rising). 
Compute the difference between two and add to the result. 
"""

def maxProfit(prices):
    n = len(prices)
    lMin = prices[0]  
    lMax = prices[0]  
    res = 0
  
    i = 0
    while i < n - 1:
      
        # Find local minima
        while i < n - 1 and prices[i] >= prices[i + 1]:
            i += 1
        lMin = prices[i]
        
        # Local Maxima
        while i < n - 1 and prices[i] <= prices[i + 1]:
            i += 1
        lMax = prices[i]
      
        # Add current profit
        res += (lMax - lMin)
  
    return res

if __name__ == "__main__":
    prices = [100, 180, 260, 310, 40, 535, 695]
    print(maxProfit(prices))





"""[Expected Approach] By Accumulating Profit - O(n) Time and O(1) Space

The idea is that profit only comes when prices rise. 
If the price goes up from one day to the next, we can think of it as buying yesterday and selling today.
Instead of waiting for the exact bottom and top, we simply grab every small upward move. 
Adding these small gains together is the same as if we had bought at each valley and sold at 
each peak because every rise between them gets counted.
"""

def maxProfit(prices):
    res = 0

    # Keep on adding the difference between
    # adjacent when the prices a
    for i in range(1, len(prices)):
        if prices[i] > prices[i - 1]:
            res += prices[i] - prices[i - 1]

    return res

if __name__ == "__main__":
    prices = [100, 180, 260, 310, 40, 535, 695]
    print(maxProfit(prices))