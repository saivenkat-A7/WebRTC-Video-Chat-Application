FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# We can run build, but since docker-compose uses NODE_ENV=development by default in the example,
# we'll just expose the port and let docker-compose define the command.
# Or provide a default command.
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
