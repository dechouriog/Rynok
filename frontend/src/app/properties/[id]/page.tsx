import { getProperty } from '@/lib/api';
import { PropertyOwnerActions } from '@/components/PropertyOwnerActions';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  return (
    <article className="max-w-2xl mx-auto">
      <img
        src={property.imageUrl || '/placeholder-house.jpg'}
        className="rounded-xl w-full h-64 object-cover"
      />

      <h1 className="text-2xl font-bold mt-4">{property.title}</h1>

      <p className="text-gray-500">{property.location}</p>

      <p className="mt-4">{property.description}</p>

      <p className="mt-4 text-xl font-bold text-rynok-accent">
        {property.priceEth} ETH
      </p>

      <p className="text-xs text-gray-400 mt-2">
        Publicado por {property.owner.walletAddress}
      </p>

      <PropertyOwnerActions property={property} />
    </article>
  );
}
