FROM python:3.10-slim

# set work directory
WORKDIR /app

# set env variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update --fix-missing
RUN apt-get install -y python3-dev 
# RUN apt-get install -y gcc libc-dev libffi-dev libpq-dev

# install dependencies
COPY app/requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
# copy project
COPY app/. .
