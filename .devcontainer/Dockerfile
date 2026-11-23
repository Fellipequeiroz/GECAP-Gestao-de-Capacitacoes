# PHP 8.3 com as extensões que o Moodle 5.3 exige (a imagem já traz git e composer).
FROM mcr.microsoft.com/devcontainers/php:1-8.3-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
       libzip-dev libxml2-dev rsync \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" intl gd zip mysqli soap exif opcache \
    && rm -rf /var/lib/apt/lists/*

RUN { \
      echo 'max_input_vars = 5000'; \
      echo 'memory_limit = 512M'; \
      echo 'upload_max_filesize = 64M'; \
      echo 'post_max_size = 64M'; \
      echo 'date.timezone = America/Sao_Paulo'; \
    } > /usr/local/etc/php/conf.d/moodle.ini
