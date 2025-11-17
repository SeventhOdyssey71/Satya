import { NextRequest, NextResponse } from 'next/server'

// In a real app, this would connect to your marketplace database/service
let marketplaceListings: any[] = []

export async function POST(request: NextRequest) {
  try {
    const listingData = await request.json()

    // Validate required fields
    if (!listingData.title || !listingData.modelBlobId) {
      return NextResponse.json(
        { error: 'Missing required fields: title and modelBlobId' },
        { status: 400 }
      )
    }

    // Validate that model is verified
    if (listingData.verificationStatus !== 'verified' || !listingData.teeAttestation || !listingData.blockchainTxDigest) {
      return NextResponse.json(
        { error: 'Model must be verified with TEE attestation and blockchain transaction' },
        { status: 400 }
      )
    }

    // Create marketplace listing
    const listing = {
      id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...listingData,
      createdAt: new Date().toISOString(),
      status: 'active',
      downloads: 0,
      rating: 0,
      reviews: [],
      // Include file sizes and blob info
      modelFileSize: listingData.modelFileSize,
      datasetFileSize: listingData.datasetFileSize,
      modelBlobId: listingData.modelBlobId,
      datasetBlobId: listingData.datasetBlobId
    }

    // Add to marketplace (in real app, save to database)
    marketplaceListings.push(listing)

    console.log('New marketplace listing created:', {
      id: listing.id,
      title: listing.title,
      modelBlobId: listing.modelBlobId,
      datasetBlobId: listing.datasetBlobId,
      verificationStatus: listing.verificationStatus
    })

    return NextResponse.json({
      success: true,
      listingId: listing.id,
      message: 'Model successfully uploaded to marketplace',
      listing: {
        id: listing.id,
        title: listing.title,
        category: listing.category,
        price: listing.price,
        verificationStatus: listing.verificationStatus
      }
    })

  } catch (error) {
    console.error('Create listing API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during listing creation' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve listings (for marketplace display)
export async function GET() {
  return NextResponse.json({
    success: true,
    listings: marketplaceListings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price: listing.price,
      verificationStatus: listing.verificationStatus,
      tags: listing.tags,
      createdAt: listing.createdAt,
      downloads: listing.downloads,
      rating: listing.rating
    }))
  })
}