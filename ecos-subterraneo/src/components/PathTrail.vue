<template>
  <div class="path-layer">
    <svg ref="svgEl" class="scene-path" xmlns="http://www.w3.org/2000/svg">
      <!-- TRONCO: desde el final del intro hasta justo antes de la última escena -->
      <line
        class="scene-path-trunk"
        :x1="trunkX"
        :y1="trunkStart"
        :x2="trunkX"
        :y2="trunkEnd"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
      />

      <!-- RAMAS: una por cada escena -->
      <path
        v-for="(branch, index) in branches"
        :key="index"
        class="scene-path-branch"
        :class="{ 'is-visible': index === visibleBranchIndex }"
        :d="branch.d"
        fill="none"
        stroke="#f5c05a"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <!-- ABEJA recorriendo el tronco -->
      <g
        v-if="hasTrunk"
        class="scene-path-bee"
        :transform="`translate(${beeX} ${beeY})`"
      >
        <image
          :href="beeUrl"
          x="-21"
          y="-16"
          width="46"
          height="46"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { usePathTrail } from './pathTrail.js'

const {
  svgEl,
  trunkStart,
  trunkEnd,
  trunkX,
  branches,
  visibleBranchIndex,
  beeX,
  beeY,
  hasTrunk,
  beeUrl,
} = usePathTrail()
</script>

<style src="@/styles/pathTrail.css"></style>
