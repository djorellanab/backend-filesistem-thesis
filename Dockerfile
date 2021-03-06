FROM node:8.11.3
WORKDIR /usr/src/app
VOLUME ["/usr/src/app/uploads"]
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]