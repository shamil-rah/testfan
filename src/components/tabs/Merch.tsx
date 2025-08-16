import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShoppingCart, Heart, Filter, Star, ChevronDown, Loader2 } from 'lucide-react';
import { MerchItem, CartItem, PrintifyVariant, PrintifyProductDetails } from '../../types';
import { fetchAllMerchItems, fetchPrintifyProductDetails } from '../../lib/supabase';

interface MerchProps {
  cart: CartItem[];
  addToCart: (item: MerchItem, selectedOptions?: { [optionName: string]: string }, printifyVariantId?: number) => void;
  onViewCart: () => void;
}

export const Merch: React.FC<MerchProps> = ({ cart, addToCart, onViewCart }) => {

   const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('alphabetically');
  const [selectedItem, setSelectedItem] = useState<MerchItem | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<{ [optionName: string]: string }>({});
  const [selectedPrintifyVariant, setSelectedPrintifyVariant] = useState<PrintifyVariant | null>(null);
  const [isFetchingPrintifyDetails, setIsFetchingPrintifyDetails] = useState(false);
  const [merchItems, setMerchItems] = useState<MerchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchMoveX, setTouchMoveX] = useState(0);
  const [isCartPopping, setIsCartPopping] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(getTotalItems());



  // Fetch merchandise items on component mount
  useEffect(() => {
    const loadMerchItems = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await fetchAllMerchItems();
        if (error) {
          console.error('Error loading merch items:', error);
        } else {
          setMerchItems(data);
        }
      } catch (error) {
        console.error('Error loading merch items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMerchItems();
  }, []);

  
  useEffect(() => {
  const currentCount = getTotalItems();
  if (currentCount > prevCartCount) {
    setIsCartPopping(true);
    setTimeout(() => setIsCartPopping(false), 300); // match animation time
  }
  setPrevCartCount(currentCount);
}, [cart]);


  // Effect to determine selected variant based on selected options
  useEffect(() => {
    if (!selectedItem?.printifyDetails || Object.keys(selectedOptions).length === 0) {
      setSelectedPrintifyVariant(null);
      return;
    }

    // Find the variant that matches the selected options
    const matchingVariant = selectedItem.printifyDetails.variants.find(variant => {
      // Get the option value IDs for the current selections
      const selectedOptionIds = Object.entries(selectedOptions).map(([optionName, optionValue]) => {
        const option = selectedItem.printifyDetails!.options.find(opt => opt.name === optionName);
        const value = option?.values.find(val => val.title === optionValue);
        return value?.id;
      }).filter(id => id !== undefined);

      // Check if this variant's options match the selected options
      return selectedOptionIds.length === variant.options.length &&
             selectedOptionIds.every(id => variant.options.includes(id as number));
    });

    setSelectedPrintifyVariant(matchingVariant || null);
  }, [selectedOptions, selectedItem?.printifyDetails]);

  const handleViewDetails = async (item: MerchItem) => {
    setSelectedItem(item);
    setSelectedOptions({});
    setSelectedPrintifyVariant(null);
    setCurrentImageIndex(0);

    // If it's a physical product, fetch Printify details
    if (item.type === 'physical' && item.printify_product_id && item.printify_shop_id) {
      setIsFetchingPrintifyDetails(true);
      try {
        const printifyDetails = await fetchPrintifyProductDetails(item.printify_shop_id, item.printify_product_id);
        
        // Debug logging to check Printify images
        console.log('Printify Details for product:', item.name);
        console.log('Total images from Printify:', printifyDetails.images.length);
        console.log('Printify images array:', printifyDetails.images);
        console.log('Available variants:', printifyDetails.variants.length);
        
        // Update the selected item with Printify details
        const updatedItem = { ...item, printifyDetails };
        setSelectedItem(updatedItem);

        // Initialize selected options with first value of each option
        const initialOptions: { [optionName: string]: string } = {};
        printifyDetails.options.forEach(option => {
          if (option.values.length > 0) {
            initialOptions[option.name] = option.values[0].title;
          }
        });
        setSelectedOptions(initialOptions);

      } catch (error) {
        console.error('Error fetching Printify details:', error);
        // You might want to show an error message to the user here
      } finally {
        setIsFetchingPrintifyDetails(false);
      }
    }
  };

  const handleOptionChange = (optionName: string, optionValue: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionName]: optionValue
    }));
  };

  const getDisplayImages = () => {
    if (!selectedItem) return [];
    
    if (selectedItem.type === 'physical' && selectedItem.printifyDetails) {
      // For physical products, use Printify images
      const { images } = selectedItem.printifyDetails;
      
      if (selectedPrintifyVariant) {
        // Filter images for the selected variant
        const variantImages = images.filter(img => 
          img.variant_ids.includes(selectedPrintifyVariant.id)
        );
        if (variantImages.length > 0) {
          return variantImages.map(img => img.src);
        }
      }
      
      // Show all available images by default
      return images.map(img => img.src);
    }
    
    // For digital products, use the original images
    return selectedItem.images;
  };

  const handlePreviousImage = () => {
    const images = getDisplayImages();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    const images = getDisplayImages();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'beats', label: 'Beats' },
    { id: 'limited', label: 'Limited Edition' }
  ];

  const sortOptions = [
    { id: 'alphabetically', label: 'Alphabetically, A-Z' },
    { id: 'price-low', label: 'Price, Low to High' },
    { id: 'price-high', label: 'Price, High to Low' },
    { id: 'newest', label: 'Date, New to Old' }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? merchItems 
    : merchItems.filter(item => item.category === selectedCategory);

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

 

  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-8 px-3 sm:px-6">
        <div className="text-center py-8 border-b border-white/10">
          <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-text mb-4 tracking-wider">
            PRODUCTS
          </h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-8 px-3 sm:px-6">
      {/* Header */}
      <div className="text-center py-6 sm:py-8 border-b border-white/10">
        <h1 className="text-3xl sm:text-5xl font-cinzel font-bold text-text mb-2 sm:mb-4 tracking-wide">
          PRODUCTS
        </h1>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-8">
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <span className="filter-label">Filter:</span>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto filter-select appearance-none pr-8 rounded-lg px-3 py-2"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto filter-select appearance-none pr-8 rounded-lg px-3 py-2"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <span className="filter-label hidden sm:inline">Sort by:</span>
            <span className="text-text-muted text-sm">{sortedItems.length} PRODUCTS</span>
            <button 
              onClick={onViewCart}
              className="relative p-2 text-text hover:text-primary transition-colors self-start sm:self-auto"
            >
              <ShoppingCart size={20} />
              {getTotalItems() > 0 && (
              <span
                className={`absolute -top-1 -right-1 bg-primary text-text text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                  isCartPopping ? 'cart-pop' : ''
                }`}
              >
                {getTotalItems()}
              </span>

              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 px-1 sm:px-0">
        {sortedItems.map((item) => (
          <div key={item.id} className="product-card">
            <div className="product-image">
              <img 
                src={item.images[0]} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="product-info">
              <h3 className="product-title">{item.name}</h3>
              <p className="text-lg font-semibold text-primary-light font-josefin mb-4">${item.price} AUD</p>
              <p className="product-description">{item.description}</p>
              
              {/* Sizes (if applicable) */}
              {item.type === 'physical' && item.sizes && item.sizes.length > 0 && (
                <div className="mb-4">
                  <p className="text-text font-cinzel font-semibold mb-2">Size:</p>
                  <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                    {item.sizes.map((size) => (
                      <span key={size} className="px-3 py-1 border border-white/20 text-text-secondary text-sm font-josefin">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleViewDetails(item)}
                className="add-to-cart-btn"
                disabled={item.stock === 0}
              >
                {item.stock === 0 ? 'Out of Stock' : 'View Details'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-full sm:max-w-lg md:max-w-4xl bg-black/95 rounded-2xl overflow-hidden shadow-xl ...">

            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
              <h3 className="text-text font-cinzel font-semibold text-xl">{selectedItem.name}</h3>
              <button 
                onClick={() => {
                  setSelectedItem(null);
                  setSelectedOptions({});
                  setSelectedPrintifyVariant(null);
                  setCurrentImageIndex(0);
                }}
                className="text-text-muted hover:text-text transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            {isFetchingPrintifyDetails ? (
              <div className="p-4 sm:p-6 text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-text-muted font-josefin">Loading product details...</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Main Image with Navigation */}
                    <div className="relative">
                      <div className="overflow-hidden relative w-full h-48 sm:h-64 md:h-80 lg:aspect-square rounded">
  <div
    className="flex transition-transform duration-300 ease-out"
    style={{
      transform: `translateX(calc(-${currentImageIndex * 100}% + ${touchMoveX}px))`
    }}
    onTouchStart={(e) => {
      setTouchStartX(e.touches[0].clientX);
      setTouchMoveX(0);
    }}
    onTouchMove={(e) => {
      if (touchStartX !== null) {
        const deltaX = e.touches[0].clientX - touchStartX;
        setTouchMoveX(deltaX);
      }
    }}
    onTouchEnd={() => {
      if (touchStartX !== null) {
        if (touchMoveX > 50) {
          handlePreviousImage();
        } else if (touchMoveX < -50) {
          handleNextImage();
        }
      }
      setTouchStartX(null);
      setTouchMoveX(0);
    }}
  >
    {getDisplayImages().map((src, idx) => (
      <img
        key={idx}
        src={src}
        alt={`${selectedItem.name} view ${idx + 1}`}
        className="w-full h-48 sm:h-64 md:h-80 lg:aspect-square object-cover flex-shrink-0"
        loading="lazy"
      />
    ))}
  </div>
</div>

                      
                      {/* Navigation Arrows - only show if multiple images */}
                      {getDisplayImages().length > 1 && (
                        <>
                          <button
                            onClick={handlePreviousImage}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300"
                          >
                            ‹
                          </button>
                          <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300"
                          >
                            ›
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {currentImageIndex + 1} / {getDisplayImages().length}
                          </div>
                        </>
                      )}
                      
                      {/* Loading indicator overlay */}
                      {isFetchingPrintifyDetails && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* Thumbnail Images - only show if multiple images */}
                    {getDisplayImages().length > 1 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                        {getDisplayImages().map((imageSrc, index) => (
                          <button
                            key={index}
                            onClick={() => handleThumbnailClick(index)}
                            className={`relative overflow-hidden rounded transition-all duration-300 ${
                              currentImageIndex === index 
                                ? 'ring-2 ring-primary opacity-100' 
                                : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img 
                              src={imageSrc} 
                              alt={`${selectedItem.name} view ${index + 1}`}
                              className="w-full h-12 sm:h-16 object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <span className="text-2xl sm:text-3xl font-bold text-primary font-josefin">
                      ${selectedPrintifyVariant ? (selectedPrintifyVariant.price / 100).toFixed(2) : selectedItem.price} AUD
                    </span>
                      <span className="text-text-muted font-josefin text-sm">
                      {selectedItem.stock > 0 ? `${selectedItem.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  
                    <p className="text-text-secondary text-sm sm:text-base font-josefin leading-relaxed">
                    {selectedItem.type === 'physical' && selectedItem.description}
                  </p>
                  
                  {/* Printify Options */}
                  {selectedItem.type === 'physical' && selectedItem.printifyDetails && (
                      <div className="space-y-4">
                      {selectedItem.printifyDetails.options.map((option) => (
                          <div key={option.name}>
                            <p className="text-text font-cinzel font-semibold mb-2 text-sm sm:text-base">Select {option.name}:</p>
                          <select
                            value={selectedOptions[option.name] || ''}
                            onChange={(e) => handleOptionChange(option.name, e.target.value)}
                              className="w-full bg-black border border-white/20 text-text p-2 sm:p-3 rounded font-josefin focus:border-primary focus:outline-none text-sm sm:text-base"
                          >
                            {option.values.map((value) => (
                              <option key={value.id} value={value.title}>
                                {value.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                      
                      {/* Display selected variant ID */}
                      {selectedPrintifyVariant && (
                          <div className="p-3 bg-gray-900/50 rounded border border-white/10">
                            <p className="text-text-muted text-sm font-josefin">
                            <span className="font-semibold">Variant:</span> {selectedPrintifyVariant.title}
                          </p>
                            <p className="text-text-muted text-xs font-josefin mt-1">
                            ID: {selectedPrintifyVariant.id}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/10">
                    <Button 
                      onClick={() => {
                        if (selectedItem.type === 'physical') {
                          addToCart(selectedItem, selectedOptions, selectedPrintifyVariant?.id);
                        } else {
                          addToCart(selectedItem);
                        }
                        setSelectedItem(null);
                        setSelectedOptions({});
                        setSelectedPrintifyVariant(null);
                        setCurrentImageIndex(0);
                      }}
                        className="flex-1 w-full text-base sm:text-lg py-3 rounded-xl"
                      disabled={
                        selectedItem.stock === 0 || 
                        (selectedItem.type === 'physical' && !selectedPrintifyVariant) ||
                        isFetchingPrintifyDetails
                      }
                    >
                      {selectedItem.stock === 0 
                        ? 'Out of Stock' 
                        : selectedItem.type === 'physical' && !selectedPrintifyVariant 
                        ? 'Select Options' 
                        : selectedItem.type === 'digital' ? 'Buy Now' : 'Add to Cart'
                      }
                    </Button>
                      <Button variant="secondary" className="px-4 sm:px-6 md:px-8 w-full sm:w-auto text-sm sm:text-base">
                      {selectedItem.type === 'digital' ? 'Preview' : 'Buy Now'}
                    </Button>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};