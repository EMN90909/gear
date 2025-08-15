FROM ubuntu:22.04
RUN apt-get update && apt-get install -y build-essential cmake git ffmpeg nodejs npm
WORKDIR /app
COPY . .
RUN cd whisper.cpp && mkdir build && cd build && cmake .. && cmake --build .
RUN cd backend && npm install express express-fileupload
CMD ["node", "backend/server.js"]
