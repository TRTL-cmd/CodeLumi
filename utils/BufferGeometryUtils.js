import { BufferAttribute, BufferGeometry, TriangleStripDrawMode, TriangleFanDrawMode } from 'three';

export function toTrianglesDrawMode( geometry, drawMode ) {
	if ( drawMode === TriangleStripDrawMode ) {
		// indices
		if ( geometry.index ) {
			const index = geometry.index.array;
			const newIndex = [];
			for ( let i = 0; i < index.length - 2; i ++ ) {
				const a = index[ i ];
				const b = index[ i + 1 ];
				const c = index[ i + 2 ];
				if ( i % 2 === 0 ) {
					newIndex.push( a, b, c );
				} else {
					newIndex.push( b, a, c );
				}
			}
			const newGeometry = geometry.clone();
			newGeometry.setIndex( newIndex );
			return newGeometry;
		} else {
			// non-indexed
			const pos = geometry.attributes.position.count;
			const newIndex = [];
			for ( let i = 0; i < pos - 2; i ++ ) {
				if ( i % 2 === 0 ) {
					newIndex.push( i, i + 1, i + 2 );
				} else {
					newIndex.push( i + 1, i, i + 2 );
				}
			}
			const newGeometry = geometry.clone();
			newGeometry.setIndex( newIndex );
			return newGeometry;
		}
	} else if ( drawMode === TriangleFanDrawMode ) {
		if ( geometry.index ) {
			const index = geometry.index.array;
			const newIndex = [];
			for ( let i = 1; i < index.length - 1; i ++ ) {
				const a = index[ 0 ];
				const b = index[ i ];
				const c = index[ i + 1 ];
				newIndex.push( a, b, c );
			}
			const newGeometry = geometry.clone();
			newGeometry.setIndex( newIndex );
			return newGeometry;
		} else {
			const pos = geometry.attributes.position.count;
			const newIndex = [];
			for ( let i = 1; i < pos - 1; i ++ ) {
				newIndex.push( 0, i, i + 1 );
			}
			const newGeometry = geometry.clone();
			newGeometry.setIndex( newIndex );
			return newGeometry;
		}
	}

	return geometry;
}
