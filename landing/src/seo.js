import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';

function Seo({ description, lang, meta, title, image }) {
  const titleTemplate = '%s | Australia Child Care';
  const metaDescription = description || 'Australia Child Care App';
  const metaImage = image || 'https://auschildcare.com/default-image.jpg';

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={titleTemplate}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          property: `og:image`,
          content: metaImage,
        },
      ].concat(meta)}
    />
  );
}

Seo.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
};

Seo.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.arrayOf(PropTypes.object),
  title: PropTypes.string.isRequired,
};

export { Helmet };
export default Seo;
