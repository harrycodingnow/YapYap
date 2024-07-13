//
//  ExploreView.swift
//  YapYap
//
//  Created by harryhou on 6/4/24.
//

import SwiftUI
import MapKit
import CoreLocation

struct MapView: View {
    @State private var scale: Double = 5.0
    
    
    
    var body: some View {
        NavigationStack {
            UserCell(selectedRadius: scale)
            .navigationTitle("Explore")
            .navigationBarTitleDisplayMode(.inline)
            
            
        }
    }
}

#Preview {
    MapView()
   }

