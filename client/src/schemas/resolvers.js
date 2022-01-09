const { AuthenticationError } = require('apollo-server-express');
const User  = require('../../server/models/User');
const Book = require('../../server/models/Book');
const { signToken } = require('../../server/utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks')
          .populate('bookCount')

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
    books: async () => {
      return Book.find();
    },
    book: async (parent, { title }) => {
      return Book.findOne({ title });
    }
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        // const book = await Book.create({ ...args, author: context.book.author });

        const updatedUser =  await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true }
        );
    
      return updatedUser;
      }
    
      throw new AuthenticationError('You need to be logged in!');
  },
        removeBook: async (parent, args, context) => {
            if(context.user) {
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: args.bookId } } },
                { new: true }
            );

            return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;

// thoughts: async (parent, { username }) => {
//   const params = username ? { username } : {};
//   return Thought.find(params).sort({ createdAt: -1 });
// },