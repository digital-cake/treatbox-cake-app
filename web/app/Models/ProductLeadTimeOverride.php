<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductLeadTimeOverride extends Model
{
    use HasFactory;

    protected $hidden = ['created_at', 'updated_at'];

    protected $fillable = [
        'title',
        'tag',
        'shop',
        'created_at', 
        'updated_at'
    ];

    public function leadTimes(): hasMany
    {
        return $this->hasMany(ProductLeadTimeOverrideWeekday::class, 'override_id');
    }
}
