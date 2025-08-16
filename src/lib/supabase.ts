import { createClient } from '@supabase/supabase-js'
import { PrintifyProductDetails } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// Helper function to create user profile
export const createUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      name: 'New User',
      role: 'user',
      avatar_url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
    })
    .select()
    .single()
  
  return { data, error }
}

// Helper function to update user profile
export const updateUserProfile = async (userId: string, updates: { name?: string; role?: string }) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Helper function to get current user's email from auth
export const getCurrentUserEmail = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || ''
}

// Helper function to toggle content like
export const toggleContentLike = async (contentId: string, userId: string) => {
  try {
    // Check if user has already liked this content
    const { data: existingLike, error: checkError } = await supabase
      .from('content_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('content_likes')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)

      if (deleteError) throw deleteError

      return { liked: false }
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('content_likes')
        .insert({
          user_id: userId,
          content_id: contentId
        })

      if (insertError) throw insertError

      return { liked: true }
    }
  } catch (error) {
    console.error('Error toggling content like:', error)
    throw error
  }
}

// Helper function to get user likes for content
export const getUserLikesForContent = async (contentIds: string[], userId: string) => {
  try {
    const { data, error } = await supabase
      .from('content_likes')
      .select('content_id')
      .eq('user_id', userId)
      .in('content_id', contentIds)

    if (error) throw error

    return data?.map(like => like.content_id) || []
  } catch (error) {
    console.error('Error fetching user likes:', error)
    return []
  }
}

// Community/Posts functions
export const createPost = async (authorId: string, title: string, content: string, imageUrl?: string, contentId?: string) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl || null,
        content_id: contentId || null
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating post:', error)
    return { data: null, error }
  }
}

export const fetchPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        content_id,
        likes_count,
        comments_count,
        created_at,
        author:user_profiles!posts_author_id_fkey (
          id,
          name,
          avatar_url
        ),
        linkedContent:content!posts_content_id_fkey (
          id,
          title,
          type,
          cover_image_url,
          file_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match our Post interface
    const transformedPosts = data?.map(post => ({
      id: post.id,
      author: {
        id: post.author.id,
        name: post.author.name,
        avatar: post.author.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
      },
      title: post.title,
      content: post.content,
      image: post.image_url,
      content_id: post.content_id,
      linkedContent: post.linkedContent ? {
        id: post.linkedContent.id,
        title: post.linkedContent.title,
        type: post.linkedContent.type,
        thumbnail: post.linkedContent.cover_image_url,
        file_url: post.linkedContent.file_url
      } : undefined,
      timestamp: new Date(post.created_at),
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      isAnnouncement: false, // You can add logic to determine this
      userHasLiked: false // Will be updated separately
    })) || []

    return { data: transformedPosts, error: null }
  } catch (error) {
    console.error('Error fetching posts:', error)
    return { data: [], error }
  }
}

export const togglePostLike = async (postId: string, userId: string) => {
  try {
    // Check if user has already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      if (deleteError) throw deleteError

      return { liked: false }
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          user_id: userId,
          post_id: postId
        })

      if (insertError) throw insertError

      return { liked: true }
    }
  } catch (error) {
    console.error('Error toggling post like:', error)
    throw error
  }
}

export const getUserLikesForPosts = async (postIds: string[], userId: string) => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error) throw error

    return data?.map(like => like.post_id) || []
  } catch (error) {
    console.error('Error fetching user likes for posts:', error)
    return []
  }
}

export const createComment = async (postId: string, authorId: string, content: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content: content.trim()
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating comment:', error)
    return { data: null, error }
  }
}
export const fetchCommentsForPost = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        post_id,
        content,
        created_at,
        author:user_profiles!comments_author_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Transform the data to match our Comment interface
    const transformedComments = data?.map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      author: {
        id: comment.author.id,
        name: comment.author.name,
        avatar: comment.author.avatar_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'
      },
      content: comment.content,
      timestamp: new Date(comment.created_at)
    })) || []

    return { data: transformedComments, error: null }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return { data: [], error }
  }
}

// Upload image to Supabase Storage
export const uploadImage = async (file: File, userId: string) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('post_images')
      .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post_images')
      .getPublicUrl(fileName)

    return { data: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { data: null, error }
  }
}

// Fetch content for selection dropdown
export const fetchContentForSelection = async () => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('id, title, type, cover_image_url, file_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching content for selection:', error)
    return { data: [], error }
  }
}

// Delete post function
export const deletePost = async (postId: string) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting post:', error)
    return { success: false, error }
  }
}

// Fetch user's total likes count
export const fetchUserLikesCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching user likes count:', error)
    return { count: 0, error }
  }
}

// Fetch user's total comments count
export const fetchUserCommentsCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching user comments count:', error)
    return { count: 0, error }
  }
}

// Fetch user's total post likes count (likes they've given to posts)
export const fetchUserPostLikesCount = async (userId: string) => {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (error) throw error

    return { count: count || 0, error: null }
  } catch (error) {
    console.error('Error fetching user post likes count:', error)
    return { count: 0, error }
  }
}

// Fetch merchandise items for home page
export const fetchHomeMerchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        uuid,
        title,
        cover_image_url,
        price
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) throw error

    // Transform data to match expected format
    const transformedData = data?.map(item => ({
      id: item.uuid,
      name: item.title,
      image: item.cover_image_url || 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg',
      price: parseFloat(item.price)
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching home merch items:', error)
    return { data: [], error }
  }
}

// Fetch all merchandise items from products table
export const fetchAllMerchItems = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        uuid,
        id,
        type,
        subtype,
        title,
        description,
        cover_image_url,
        price,
        is_active
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to match MerchItem interface with Printify images
    const transformedData = await Promise.all(data?.map(async item => {
      const baseItem = {
        id: item.uuid,
        name: item.title,
        price: parseFloat(item.price),
        description: item.description || '',
        stock: 100, // Default stock for now
        isNew: false,
        type: item.type as 'physical' | 'digital',
        subtype: item.subtype as 'music' | 'beats' | 'book' | undefined
      }

      if (item.type === 'physical') {
        // Fetch Printify images for physical products
        let productImages = [item.cover_image_url || 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg']
        
        try {
          if (item.id) {
            const printifyDetails = await fetchPrintifyProductDetails('22633787', item.id)
            if (printifyDetails.images && printifyDetails.images.length > 0) {
              // Use the first (default) image from Printify
              const defaultImage = printifyDetails.images.find(img => img.is_default) || printifyDetails.images[0]
              productImages = [defaultImage.src]
            }
          }
        } catch (printifyError) {
          console.warn(`Failed to fetch Printify images for product ${item.title}:`, printifyError)
          // Keep using the fallback image if Printify fetch fails
        }

        return {
          ...baseItem,
          images: productImages,
          category: 'clothing' as const, // Default category for physical items
          sizes: [], // Will be populated when Printify integration is added
          printify_product_id: item.id,
          printify_shop_id: '22633787'
        }
      } else {
        // Digital product
        return {
          ...baseItem,
          images: [item.cover_image_url || 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'],
          category: item.subtype === 'beats' ? 'beats' as const : 'limited' as const,
          digital_asset_path: item.id
        }
      }
    }) || [])

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching merch items:', error)
    return { data: [], error }
  }
}

// Home page data fetching functions
export const fetchFeaturedContent = async () => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select(`
        id,
        title,
        type,
        description,
        cover_image_url,
        file_url,
        likes,
        created_at,
        artist:artists!content_artist_id_fkey (
          id,
          name,
          stage_name
        )
      `)
      .eq('is_active', true)
      .eq('status', 'public')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching featured content:', error)
    return { data: null, error }
  }
}

export const fetchHomeCommunityPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        image_url,
        created_at,
        likes_count,
        comments_count,
        author:user_profiles!posts_author_id_fkey (
          id,
          name,
          avatar_url,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6)

    if (error) throw error

    // Transform data for community posts display
    const transformedData = data?.map(post => ({
      id: post.id,
      title: post.title,
      content: post.content,
      image_url: post.image_url,
      timestamp: new Date(post.created_at),
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      author: post.author,
      isAnnouncement: post.author.role === 'admin' || post.author.role === 'staff',
      type: post.image_url ? 'image' : 'text',
      title: post.title
    })) || []

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error fetching home community posts:', error)
    return { data: [], error }
  }
}

// Printify API integration
export const fetchPrintifyProductDetails = async (shopId: string, productId: string): Promise<PrintifyProductDetails> => {
  const apiKey = import.meta.env.VITE_PRINTIFY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Printify API key not configured');
  }

  try {
    const response = await fetch(`/api/printify/v1/shops/${shopId}/products/${productId}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Printify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as PrintifyProductDetails;
  } catch (error) {
    console.error('Error fetching Printify product details:', error);
    throw error;
  }
};