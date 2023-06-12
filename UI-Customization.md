# Customizing the UI Component

This guide will help you customize the UI component with the following options:

## 1. Customize the Login Logo

To customize the login logo, follow these steps:
- Create a 300x80 pixels SVG file.
- Base64 encode the SVG file.
- Save the encoded file to the environment variable `CUSTOM_LOGIN_LOGO`.

## 2. Customize the Policy

To customize the policy, follow these steps:
- The policy content can be plain HTML or text.
- Base64 encode the policy content.
- Save the encoded content to the environment variable `CUSTOM_EULA_POLICY`.

## 3. Customize the Page Banner

To customize the page banner, follow these steps:

### Header Customization

- Customize the header's content and color.
- The color of the header banner is required.
- The color value can be a color keyword (e.g., yellow) or a Hex value (e.g., #ffff00).
- The content is optional and can be one line of plain HTML or text with a maximum of 120 characters.
- Base64 encode the header content.
- Save the encoded content to the environment variables `CUSTOM_PAGE_HEADER_COLOR` and `CUSTOM_PAGE_HEADER_CONTENT`.

### Footer Customization

- Customize the footer's content and color.
- The color of the footer banner will be the same as the header banner if the color is not customized.
- The content is optional and can be one line of plain HTML or text with a maximum of 120 characters.
- Base64 encode the footer content.
- Save the encoded content to the environment variables `CUSTOM_PAGE_FOOTER_COLOR` and `CUSTOM_PAGE_FOOTER_CONTENT`.


The environment variables (`CUSTOM_LOGIN_LOGO`, `CUSTOM_EULA_POLICY`, `CUSTOM_PAGE_HEADER_COLOR`, `CUSTOM_PAGE_HEADER_CONTENT`, `CUSTOM_PAGE_FOOTER_COLOR`, `CUSTOM_PAGE_FOOTER_CONTENT`) are defined in the [helm chart](https://github.com/neuvector/neuvector-helm/blob/master/charts/core/templates/manager-deployment.yaml).


