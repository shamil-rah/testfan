import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { CartItem } from '../../types';

interface CartProps {
  cart: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  onBackToMerch: () => void;
}

export const Cart: React.FC<CartProps> = ({ 
  cart, 
  updateQuantity, 
  removeFromCart, 
  onBackToMerch 
}) => {
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBackToMerch}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Merch</span>
          </Button>
        </div>

        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-4 font-cinzel">Your Cart is Empty</h2>
          <p className="text-text-muted mb-8 font-josefin">Add some items from our merch collection to get started</p>
          <Button onClick={onBackToMerch}>
            Shop Merch
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBackToMerch}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Back to Merch</span>
          </Button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text font-cinzel">
          Cart ({getTotalItems()})
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {cart.map((cartItem) => (
            <Card key={cartItem.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <img 
                  src={cartItem.item.images[0]} 
                  alt={cartItem.item.name}
                  className="w-full h-32 sm:w-20 sm:h-20 object-cover rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-text font-semibold font-cinzel mb-1">
                    {cartItem.item.name}
                  </h3>
                  <p className="text-primary-light font-josefin font-semibold">
                    ${cartItem.item.price} AUD
                  </p>
                  {cartItem.selectedOptions && Object.keys(cartItem.selectedOptions).length > 0 && (
                    <p className="text-text-muted text-sm font-josefin">
                      {Object.entries(cartItem.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </p>
                  )}
                  {cartItem.printifyVariantId && (
                    <p className="text-text-muted text-xs font-josefin">
                      Variant ID: {cartItem.printifyVariantId}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-start sm:space-x-3">
                  <div className="flex items-center space-x-3">
                  <button
                    onClick={() => updateQuantity(cartItem.id, Math.max(0, cartItem.quantity - 1))}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-text transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="text-text font-semibold w-8 text-center">
                    {cartItem.quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-text transition-colors"
                  >
                    <Plus size={16} />
                  </button>

                  </div>
                  
                  <div className="text-right sm:ml-4">
                  <p className="text-text font-semibold font-josefin">
                    ${(cartItem.item.price * cartItem.quantity).toFixed(2)} AUD
                  </p>
                  <button
                    onClick={() => removeFromCart(cartItem.id)}
                    className="text-error hover:text-error mt-2 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <h3 className="text-lg font-bold text-text mb-4 font-cinzel">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-text-secondary">
                <span className="font-josefin">Subtotal ({getTotalItems()} items)</span>
                <span className="font-josefin">${getTotalPrice().toFixed(2)} AUD</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span className="font-josefin">Shipping</span>
                <span className="font-josefin">Free</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between text-text font-semibold text-lg">
                <span className="font-cinzel">Total</span>
                <span className="font-josefin">${getTotalPrice().toFixed(2)} AUD</span>
              </div>
            </div>

            <Button className="w-full mb-4">
              Proceed to Checkout
            </Button>
            
            <Button variant="secondary" className="w-full" onClick={onBackToMerch}>
              Continue Shopping
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};