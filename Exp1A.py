# #Single line comments using hashtag
# print("Single line comment")

# """This is experiment 1 A first program.
# It is t demonstrate the features of multiline comments.
# And then print some output."""
# print("First Program")

# a=10
# b=3.34
# c="Hi"
# d=3 + 4j
# e=True
# f=b"Hi"
# print(a, type(a))
# print(b, type(b))
# print(c, type(c))
# print(d, type(d))
# print(e, type(e))
# print(f, type(f))

# a=[]
# a.append(int(input("Enter an integer")))
# a.append(float(input("Enter a decimal number")))
# a.append(input("Enter a word"))
# a.append(True)
# print(a)

# a=[1,2,3,4,5]
# a.append(6)
# print(a)

# a=["Hi",10,20.4,True]
# print(a)
# b=a.copy()
# print("Copied list before: ",b)
# a.append("Bye")
# print("New List: ",a)
# print("Copied List: ",b)

# a=[1,2,3]
# b=[4,5,6]
# c=a+b
# print(c)

# a=[1,2,3]
# a.extend([4,5])
# print(a)

# a = list(map(int, input("Enter elements: ").split()))
# print(a)

# a=[1,2,3,4,5,6,7,8,9,10]
# print(a[2:5])
# length=len(a)
# if length%2==0:
#     print(a[(length//2)-1],a[length//2])
# else:
#     print(a[length//2])

# brother=12
# sister=15
# if brother>sister:
#     print("Brother")
# elif sister>brother:
#     print("Sister")
# else:
#     print("Both are of same age")

# a=[1,2,3,4,5]
# for i in range(len(a)):
#     print(a[i]," ")

# a = ["apple", "banana", "cherry", "date"]
# for index, elements in enumerate(a):
#     print(index," : ",elements)

# def printing():
#     print("This is a function")
# printing()

# a=int(input("Enter a number "))
# b=int(input("Enter another number "))
# def add(x,y):
#     print("Sum: ",x+y)
# add(a,b)

# a=input("Enter a string ")
# b=input("Enter another string ")
# def concatenate(x,y):
#     print("Concatenate ",x+y)
# concatenate(a,b)

# a={1,2,3,4,5}
# print(a)

# a={"Hello","hello"}
# print(a)
# print(len(a))

# a={
#     'carname' : 'BMW',
#     'color' : 'Black',
#     'price(in lakhs)' : 50
# }
# print(a)

# a1={
#     'carname' : 'BMW',
#     'color' : 'black'
# }
# a2={
#     'carname' : 'Mercedes',
#     'color' : 'blue'
# }
# a3={
#     'carname' : 'Tesla',
#     'color' : 'grey'
# }
# cars={
#     'car1' : a1,
#     'car2' : a2,
#     'car3' : a3
# }
# print(cars)

# a=(1,3.14,"Hi",['a','b','c'],True)
# print(a)
# b=("Bye",2)
# c=a+b
# print(c.index("Bye"))