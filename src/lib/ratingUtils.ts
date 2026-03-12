import { supabase } from './supabaseClient';

/**
 * Check if a user has already rated a specific destination
 * @param destinationId - The destination ID to check
 * @param userId - The user ID to check
 * @returns true if the user has already rated this destination, false otherwise
 */
export async function hasUserRatedDestination(
  destinationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('destination_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('destination_id', destinationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking destination rating:', error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error('Error checking destination rating:', error);
    return false;
  }
}

/**
 * Check if a user has already rated a specific product
 * @param productId - The product ID to check
 * @param userId - The user ID to check
 * @returns true if the user has already rated this product, false otherwise
 */
export async function hasUserRatedProduct(
  productId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('product_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking product rating:', error);
      return false;
    }

    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error('Error checking product rating:', error);
    return false;
  }
}
