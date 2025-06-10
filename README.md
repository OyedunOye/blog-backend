# Shade blog app backend

A collection of endpoints that sets up express.js server, mongoBD database and cloudinary cloud media management services for the blog frontend app. Implements set of endpoints that recieves data from the frontend, or other clients like postman, and use this data to perform CRUD functions on the mongoDB.

## API Reference

#### Create new user

```http
  POST {BASE_URL}users
```

| Parameter   | Type     | Description                                            |
| :---------- | :------- | :----------------------------------------------------- |
| `firstName` | `string` | **Required**. Your first name                          |
| `lastName`  | `string` | **Required**. Your last name                           |
| `email`     | `string` | **Required**. Your email address                       |
| `password`  | `string` | **Required**. Password that will be required for login |
| `authorImg` | `file`   | **Optional**. Your profile picture                     |

#### User login

```http
  POST {BASE_URL}login
```

| Parameter  | Type     | Description                                    |
| :--------- | :------- | :--------------------------------------------- |
| `email`    | `string` | **Required**. Your registered email            |
| `password` | `string` | **Required**. Password created on registration |

#### Get authors, i.e. all users who have posted at least a blog

```http
  GET {BASE_URL}users/authors
```

#### Get a single authenticated user data

```http
  GET {BASE_URL}users/profile
```

| Parameter | Type     | Description                                               |
| :-------- | :------- | :-------------------------------------------------------- |
| `token`   | `string` | **Required**. Extracted from user authentication on login |

#### Update a user's data that was created on sign up

```http
  PATCH {BASE_URL}users/edit-profile
```

| Parameter                    | Type     | Description                                                                                |
| :--------------------------- | :------- | :----------------------------------------------------------------------------------------- |
| `token`                      | `string` | **Required**. Extracted from user authentication on login                                  |
| `email, firstName, lastName` | `string` | **Optional with condition**. At least one if no authorImg is provided                      |
| `authorImg`                  | `file`   | **Optional with condition**. Required if none of the three fields listed above is provided |

```http
  PATCH {BASE_URL}users/change-password
```

| Parameter     | Type     | Description                                               |
| :------------ | :------- | :-------------------------------------------------------- |
| `token`       | `string` | **Required**. Extracted from user authentication on login |
| `oldPassword` | `string` | **Required**. Current password                            |
| `newPassword` | `string` | **Required**. New password                                |

```http
  DELETE {BASE_URL}users/delete-profile
```

| Parameter | Type     | Description                                               |
| :-------- | :------- | :-------------------------------------------------------- |
| `token`   | `string` | **Required**. Extracted from user authentication on login |

#### Create a new blog

```http
  POST {BASE_URL}blogs
```

| Parameter     | Type     | Description                                                               |
| :------------ | :------- | :------------------------------------------------------------------------ |
| `token`       | `string` | **Required**. Extracted from user authentication on login                 |
| `title`       | `string` | **Required**. Your blog's title                                           |
| `blogContent` | `string` | **Required**. Your blog's body                                            |
| `readTime`    | `string` | **Required**. Calculated from the word length of the blogContent          |
| `category`    | `string` | **Required**. Your blogs category from the list available on the frontend |
| `articleImg`  | `string` | **Required**. Your blog's cover image                                     |

#### Get all blogs from all authors

```http
  GET {BASE_URL}blogs
```

#### Edit a blog

```http
  PATCH {BASE_URL}blogs/${id}
```

| Parameter                      | Type     | Description                                                                                         |
| :----------------------------- | :------- | :-------------------------------------------------------------------------------------------------- |
| `token`                        | `string` | **Required**. Extracted from user authentication on login                                           |
| `id`                           | `string` | **Required**. Id of blog to update                                                                  |
| `title, blogContent, readTime` | `string` | **Optional with condition**. At least one of these is required if no articleImg is provided         |
| `articleImg`                   | `file`   | **Optional with condition**. Article cover image required if none of the 3 fields above is provided |

#### Get the number of blogs in each of the available categories on the frontend

```http
  GET {BASE_URL}blogs/category-count
```

#### Write a comment on a blog

```http
  POST {BASE_URL}blogs/comment/${id}
```

| Parameter | Type     | Description                                               |
| :-------- | :------- | :-------------------------------------------------------- |
| `token`   | `string` | **Required**. Extracted from user authentication on login |
| `id`      | `string` | **Required**. Id of blog to comment on                    |
| `comment` | `string` | **Required**. Comment content                             |

#### Love or unlove a blog

```http
  PATCH {BASE_URL}blogs/love/${id}
```

| Parameter | Type     | Description                                               |
| :-------- | :------- | :-------------------------------------------------------- |
| `token`   | `string` | **Required**. Extracted from user authentication on login |
| `id`      | `string` | **Required**. Id of blog to comment on                    |

#### Delete a note

```http
  DELETE {BASE_URL}blogs/${id}
```

| Parameter | Type     | Description                                               |
| :-------- | :------- | :-------------------------------------------------------- |
| `id`      | `string` | **Required**. Id of the blog to be deleted                |
| `token`   | `string` | **Required**. Extracted from user authentication on login |

## Authors

- [@'Sade](https://github.com/OyedunOye)

## Contributor

- [@Peter](https://github.com/Peter-Odo)

## Run Locally

Clone the project

```bash
  git clone https://github.com/OyedunOye/blog-backend
```

Go to the project directory

```bash
  cd blog-backend
```

Install dependencies

```bash
  npm install --legacy-peer-deps
```

Start the server

```bash
  npm run dev
```

## Tech Stack

**Server:** Node, Express

**Database:** MongoDB

**Cloud media management:** Cloudinary
