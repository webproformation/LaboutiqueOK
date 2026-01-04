import { gql } from '@apollo/client/core';

export const GET_PRODUCTS = gql`
  query GetProducts {
    products(first: 100) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_PAGINATED = gql`
  query GetProductsPaginated($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = gql`
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      __typename
      ... on SimpleProduct {
        id
        databaseId
        name
        slug
        onSale
        price
        regularPrice
        salePrice
        stockQuantity
        stockStatus
        description
        image {
          sourceUrl
        }
        galleryImages {
          nodes {
            sourceUrl
          }
        }
        attributes {
          nodes {
            name
            ... on GlobalProductAttribute {
              slug
            }
            options
          }
        }
      }
      ... on VariableProduct {
        id
        databaseId
        name
        slug
        onSale
        price
        regularPrice
        salePrice
        stockQuantity
        stockStatus
        description
        image {
          sourceUrl
        }
        galleryImages {
          nodes {
            sourceUrl
          }
        }
        attributes {
          nodes {
            name
            variation
            ... on GlobalProductAttribute {
              slug
            }
            ... on LocalProductAttribute {
              id
            }
            options
          }
        }
        variations(first: 100) {
          nodes {
            id
            databaseId
            name
            price
            regularPrice
            salePrice
            stockQuantity
            stockStatus
            onSale
            image {
              sourceUrl
            }
            attributes {
              nodes {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ... on SimpleProduct {
        id
        databaseId
        name
        slug
        status
        onSale
        price
        regularPrice
        salePrice
        stockQuantity
        stockStatus
        manageStock
        featured
        description
        shortDescription
        image {
          sourceUrl
        }
        galleryImages {
          nodes {
            sourceUrl
          }
        }
      }
      ... on VariableProduct {
        id
        databaseId
        name
        slug
        status
        onSale
        price
        regularPrice
        salePrice
        stockQuantity
        stockStatus
        manageStock
        featured
        description
        shortDescription
        image {
          sourceUrl
        }
        galleryImages {
          nodes {
            sourceUrl
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($ids: [Int!]!) {
    products(first: 100, where: { include: $ids }) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCT_CATEGORIES = gql`
  query GetProductCategories {
    productCategories(first: 100) {
      nodes {
        id
        name
        slug
        description
        image {
          sourceUrl
        }
        count
        parentId
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($categorySlug: String!) {
    products(first: 100, where: { category: $categorySlug }) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
          variations {
            nodes {
              id
              databaseId
              name
              price
              regularPrice
              salePrice
              stockQuantity
              stockStatus
            }
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS_BY_CATEGORIES = gql`
  query GetProductsByCategories($categorySlugs: [String]!) {
    products(first: 100, where: { categoryIn: $categorySlugs }) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          status
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          image {
            sourceUrl
          }
          galleryImages {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
          variations {
            nodes {
              id
              databaseId
              name
              price
              regularPrice
              salePrice
              stockQuantity
              stockStatus
            }
          }
        }
      }
    }
  }
`;

export const GET_LIVE_EVENTS = gql`
  query GetLiveEvents {
    liveEvents(first: 10) {
      nodes {
        id
        title
        date
        liveEventFields {
          videoUrl
          timeline {
            timeStart
            timeEnd
            productAssociated {
              ... on Product {
                id
                name
                slug
                ... on SimpleProduct {
                  price
                }
                image {
                  sourceUrl
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_HOME_SLIDERS = gql`
  query GetHomeSliders {
    sliders(first: 10, where: { orderby: { field: DATE, order: ASC } }) {
      nodes {
        id
        title
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_POST_CATEGORIES = gql`
  query GetPostCategories {
    categories(first: 100, where: { hideEmpty: true }) {
      nodes {
        id
        name
        slug
        description
        count
      }
    }
  }
`;

export const GET_POSTS = gql`
  query GetPosts($first: Int = 100) {
    posts(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_POSTS_BY_CATEGORY = gql`
  query GetPostsByCategory($categorySlug: String!, $first: Int = 100) {
    posts(first: $first, where: { categoryName: $categorySlug, orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        databaseId
        title
        slug
        excerpt
        date
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        categories {
          nodes {
            id
            name
            slug
          }
        }
      }
    }
  }
`;

export const GET_POST_BY_SLUG = gql`
  query GetPostBySlug($slug: String!) {
    post(id: $slug, idType: SLUG) {
      id
      databaseId
      title
      slug
      excerpt
      date
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      categories {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String!) {
    products(first: 20, where: { search: $search }) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          shortDescription
          image {
            sourceUrl
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          shortDescription
          image {
            sourceUrl
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_FEATURED_PRODUCTS = gql`
  query GetFeaturedProducts {
    products(first: 12, where: { featured: true, status: "publish" }) {
      nodes {
        ... on SimpleProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          featured
          image {
            sourceUrl
          }
          galleryImages(first: 2) {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
        ... on VariableProduct {
          id
          databaseId
          name
          slug
          onSale
          price
          regularPrice
          salePrice
          stockQuantity
          stockStatus
          featured
          image {
            sourceUrl
          }
          galleryImages(first: 2) {
            nodes {
              sourceUrl
            }
          }
          attributes {
            nodes {
              name
              options
              ... on GlobalProductAttribute {
                slug
              }
              ... on LocalProductAttribute {
                id
              }
            }
          }
        }
      }
    }
  }
`;
