## 1. Customizing the Login Page Logo

To customize the login page logo, follow these steps:
1. Create a 300x80 pixels SVG file.
2. Base64 encode the SVG file.
3. Save the base64 encoded string in the environment variable `CUSTOM_LOGIN_LOGO`.

## 2. Customizing the Prompt Message of Policy and Terms

To customize the prompt message of Policy and Terms, follow these guidelines:
- Provide a plain HTML or text with no more than two lines.
- Each line should not exceed 50 characters.
- Use anchor tags to indicate clickable portions, for example:
  `I have read and consent to terms in <a>IS user agreement</a>`.
- Base64 encode the HTML or text.
- Save the base64 encoded string in the environment variable `CUSTOM_EULA_PROMPT`.

## 3. Customizing the Content of Policy and Terms

To customize the content of Policy and Terms, follow these steps:
1. Provide a plain HTML or text.
2. Base64 encode the HTML or text.
3. Save the base64 encoded string in the environment variable `CUSTOM_EULA_POLICY`.

## 4. Customizing the Content of the Page Header

To customize the content of the page header, follow these guidelines:
- Provide a plain HTML or text with no more than two lines.
- Each line can have a maximum of 100 characters.
- Base64 encode the HTML or text.
- Save the base64 encoded string in the environment variable `CUSTOM_PAGE_HEADER`.

Remember to replace the environment variable placeholders (`CUSTOM_LOGIN_LOGO`, `CUSTOM_EULA_PROMPT`, `CUSTOM_EULA_POLICY`, `CUSTOM_PAGE_HEADER`) with the actual environment variable names used in your system.

Feel free to adjust the formatting or add any additional instructions as needed for your specific application.
